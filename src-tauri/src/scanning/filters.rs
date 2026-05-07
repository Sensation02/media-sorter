const KNOWN_HIDDEN_NAMES: &[&str] = &["Thumbs.db", "desktop.ini"];

/// Returns `true` if a file name should be treated as hidden / system noise
/// and skipped during media scanning.
///
/// Covered cases:
/// - Unix dotfiles (`.DS_Store`, `.git`, etc.)
/// - macOS metadata sidecars (`._something.jpg`) — captured by the dotfile rule
/// - Known Windows system files (`Thumbs.db`, `desktop.ini`)
pub fn is_hidden(name: &str) -> bool {
    if name.starts_with('.') {
        return true;
    }

    KNOWN_HIDDEN_NAMES.contains(&name)
}
