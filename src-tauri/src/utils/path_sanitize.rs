pub const FORBIDDEN_FOLDER_NAME_CHARS: &[char] = &['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

const SANITIZED_FALLBACK: &str = "_";

pub fn sanitize_path_segment(segment: &str) -> String {
    let trimmed = segment.trim();

    let has_meaningful_char = trimmed
        .chars()
        .any(|character| !FORBIDDEN_FOLDER_NAME_CHARS.contains(&character) && character != '.');

    if !has_meaningful_char {
        return SANITIZED_FALLBACK.to_string();
    }

    trimmed
        .chars()
        .map(|character| {
            if FORBIDDEN_FOLDER_NAME_CHARS.contains(&character) {
                '-'
            } else {
                character
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_replaces_each_forbidden_char() {
        assert_eq!(sanitize_path_segment("Sony/A7"), "Sony-A7");
        assert_eq!(sanitize_path_segment("a:b*c?"), "a-b-c-");
        assert_eq!(sanitize_path_segment("a\\b<c>d|e\"f"), "a-b-c-d-e-f");
        assert_eq!(sanitize_path_segment("  Sony/A7  "), "Sony-A7");
    }

    #[test]
    fn sanitize_leaves_safe_segment_unchanged() {
        assert_eq!(sanitize_path_segment("Paris, France"), "Paris, France");
        assert_eq!(sanitize_path_segment("2024-02"), "2024-02");
    }

    #[test]
    fn sanitize_empty_or_dotonly_segment_falls_back() {
        assert_eq!(sanitize_path_segment("///"), "_");
        assert_eq!(sanitize_path_segment("   "), "_");
        assert_eq!(sanitize_path_segment("."), "_");
        assert_eq!(sanitize_path_segment(".."), "_");
        assert_eq!(sanitize_path_segment("..."), "_");
    }
}
