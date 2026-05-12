pub mod domain;
pub mod error;
pub mod geo;
pub mod history;
pub mod i18n;
pub mod metadata;
pub mod scanning;
pub mod settings;
pub mod sorting;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            settings::hydrate(app.handle())?;
            Ok(())
        })
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
            settings::command::get_settings,
            settings::command::set_settings,
            settings::command::reset_settings,
            settings::command::get_memo,
            settings::command::set_memo,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
