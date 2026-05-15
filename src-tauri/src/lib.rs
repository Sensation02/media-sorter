use tauri::Manager;

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
            let handle = app.handle();
            let app_settings = settings::hydrate(handle)?;
            collect_history_retention(handle, app_settings.history_retention_days);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scanning::command::pick_source_dir,
            scanning::command::scan_source,
            scanning::command::reveal_directory,
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

fn collect_history_retention<R: tauri::Runtime>(app: &tauri::AppHandle<R>, retention_days: u16) {
    let Ok(data_dir) = app.path().app_data_dir() else {
        return;
    };

    let jobs_dir = data_dir.join("jobs");
    let now_ms = utils::now_ms();

    match history::gc::collect(&jobs_dir, retention_days, now_ms) {
        Ok(0) => {}
        Ok(count) => eprintln!("[history] gc removed {count} expired job(s)"),
        Err(err) => eprintln!("[history] gc failed: {err}"),
    }
}
