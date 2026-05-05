pub mod commands;
pub mod domain;
pub mod dto;
pub mod error;
pub mod repositories;
pub mod services;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::pick_source_dir,
            commands::scan_source,
            commands::preview_plan,
            commands::start_sort,
            commands::pause_sort,
            commands::cancel_sort,
            commands::revert_job,
            commands::list_history,
            commands::reveal_in_os,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
