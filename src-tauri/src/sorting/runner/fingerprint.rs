use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::Path;

use sha2::{Digest, Sha256};

const REGION_BYTES: u64 = 64 * 1024;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fingerprint {
    pub size: u64,
    pub head: [u8; 32],
    pub tail: [u8; 32],
}

impl Fingerprint {
    pub fn of(path: &Path) -> io::Result<Self> {
        let mut file = File::open(path)?;
        let size = file.metadata()?.len();

        let head_length = size.min(REGION_BYTES);
        let head = hash_region(&mut file, 0, head_length)?;

        let tail_offset = size.saturating_sub(REGION_BYTES);
        let tail_length = size - tail_offset;
        let tail = hash_region(&mut file, tail_offset, tail_length)?;

        Ok(Self { size, head, tail })
    }
}

fn hash_region(file: &mut File, offset: u64, length: u64) -> io::Result<[u8; 32]> {
    file.seek(SeekFrom::Start(offset))?;

    let mut buffer = vec![0_u8; length as usize];
    file.read_exact(&mut buffer)?;

    let digest = Sha256::digest(&buffer);

    Ok(digest.into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::tempdir;

    fn write_file(path: &Path, bytes: &[u8]) {
        let mut file = File::create(path).expect("create");
        file.write_all(bytes).expect("write");
    }

    #[test]
    fn empty_file_produces_deterministic_fingerprint() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("empty.bin");
        write_file(&path, b"");

        let fingerprint = Fingerprint::of(&path).expect("fingerprint");

        assert_eq!(fingerprint.size, 0);
        assert_eq!(fingerprint.head, fingerprint.tail);
    }

    #[test]
    fn identical_small_files_produce_equal_fingerprints() {
        let dir = tempdir().expect("tempdir");
        let path_a = dir.path().join("a.bin");
        let path_b = dir.path().join("b.bin");
        write_file(&path_a, b"hello world");
        write_file(&path_b, b"hello world");

        let fp_a = Fingerprint::of(&path_a).expect("fp a");
        let fp_b = Fingerprint::of(&path_b).expect("fp b");

        assert_eq!(fp_a, fp_b);
    }

    #[test]
    fn different_content_same_size_differs_in_head_or_tail() {
        let dir = tempdir().expect("tempdir");
        let path_a = dir.path().join("a.bin");
        let path_b = dir.path().join("b.bin");
        write_file(&path_a, b"AAAAA");
        write_file(&path_b, b"BBBBB");

        let fp_a = Fingerprint::of(&path_a).expect("fp a");
        let fp_b = Fingerprint::of(&path_b).expect("fp b");

        assert_eq!(fp_a.size, fp_b.size);
        assert_ne!(fp_a, fp_b);
    }

    #[test]
    fn large_file_with_matching_head_but_different_tail_differs() {
        let dir = tempdir().expect("tempdir");
        let path_a = dir.path().join("a.bin");
        let path_b = dir.path().join("b.bin");

        let mut content_a = vec![b'A'; (REGION_BYTES * 2) as usize];
        let mut content_b = content_a.clone();

        let last_index = content_a.len() - 1;
        content_a[last_index] = b'X';
        content_b[last_index] = b'Y';

        write_file(&path_a, &content_a);
        write_file(&path_b, &content_b);

        let fp_a = Fingerprint::of(&path_a).expect("fp a");
        let fp_b = Fingerprint::of(&path_b).expect("fp b");

        assert_eq!(fp_a.head, fp_b.head);
        assert_ne!(fp_a.tail, fp_b.tail);
    }

    #[test]
    fn large_file_with_matching_tail_but_different_head_differs() {
        let dir = tempdir().expect("tempdir");
        let path_a = dir.path().join("a.bin");
        let path_b = dir.path().join("b.bin");

        let mut content_a = vec![b'A'; (REGION_BYTES * 2) as usize];
        let mut content_b = content_a.clone();
        content_a[0] = b'X';
        content_b[0] = b'Y';

        write_file(&path_a, &content_a);
        write_file(&path_b, &content_b);

        let fp_a = Fingerprint::of(&path_a).expect("fp a");
        let fp_b = Fingerprint::of(&path_b).expect("fp b");

        assert_ne!(fp_a.head, fp_b.head);
        assert_eq!(fp_a.tail, fp_b.tail);
    }

    #[test]
    fn file_smaller_than_region_overlaps_head_and_tail() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("tiny.bin");
        write_file(&path, b"abc");

        let fp = Fingerprint::of(&path).expect("fp");

        assert_eq!(fp.size, 3);
        assert_eq!(fp.head, fp.tail);
    }
}
