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
            scanning::command::pick_source_dir,
            scanning::command::scan_source,
            scanning::command::reveal_in_os,
            sorting::command::preview_plan,
            sorting::command::start_sort,
            sorting::command::pause_sort,
            sorting::command::cancel_sort,
            history::command::list_history,
            history::command::revert_job,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
