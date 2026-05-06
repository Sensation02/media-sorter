pub mod domain;
pub mod error;
pub mod history;
pub mod scanning;
pub mod sorting;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scanning::pick_source_dir,
            scanning::scan_source,
            scanning::reveal_in_os,
            sorting::preview_plan,
            sorting::start_sort,
            sorting::pause_sort,
            sorting::cancel_sort,
            history::list_history,
            history::revert_job,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
