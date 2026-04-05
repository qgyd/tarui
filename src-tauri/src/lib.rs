use serde::Serialize;
use sysinfo::{System, Disks};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Serialize)]
struct SystemInfo {
    system_name: Option<String>,
    kernel_version: Option<String>,
    os_version: Option<String>,
    host_name: Option<String>,
    cpu_info: Vec<CpuInfo>,
    total_memory: u64,
    used_memory: u64,
    disks: Vec<DiskInfo>,
}

#[derive(Serialize)]
struct CpuInfo {
    name: String,
    brand: String,
    frequency: u64,
}

#[derive(Serialize)]
struct DiskInfo {
    name: String,
    mount_point: String,
    total_space: u64,
    available_space: u64,
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let disks_info = Disks::new_with_refreshed_list();

    let cpu_info = sys
        .cpus()
        .iter()
        .map(|cpu| CpuInfo {
            name: cpu.name().to_string(),
            brand: cpu.brand().to_string(),
            frequency: cpu.frequency(),
        })
        .collect();

    let disks = disks_info
        .iter()
        .map(|disk| DiskInfo {
            name: disk.name().to_string_lossy().into_owned(),
            mount_point: disk.mount_point().to_string_lossy().into_owned(),
            total_space: disk.total_space(),
            available_space: disk.available_space(),
        })
        .collect();

    SystemInfo {
        system_name: System::name(),
        kernel_version: System::kernel_version(),
        os_version: System::os_version(),
        host_name: System::host_name(),
        cpu_info,
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        disks,
    }
}

use std::process::Command;

#[tauri::command]
async fn convert_media_native(
    _app_handle: tauri::AppHandle,
    input_path: String,
    output_path: String,
) -> Result<String, String> {
    // 检查 ffmpeg 是否已安装
    let status = Command::new("ffmpeg")
        .arg("-version")
        .status()
        .map_err(|_| "未找到 ffmpeg 命令，请确保已安装 ffmpeg 并添加到系统路径 (例如: brew install ffmpeg)")?;

    if !status.success() {
        return Err("ffmpeg 命令执行失败".to_string());
    }

    // 运行 ffmpeg 转换命令
    // 这里我们可以添加更多参数来优化性能，例如多线程 (-threads 0)
    let child = Command::new("ffmpeg")
        .args(&[
            "-i", &input_path,
            "-y", // 覆盖已存在的文件
            "-threads", "0", // 使用所有可用 CPU 核心
            &output_path,
        ])
        .spawn()
        .map_err(|e| format!("无法启动 ffmpeg: {}", e))?;

    // 在后台运行，我们不需要等待它完成，除非我们需要返回结果。
    // 但为了显示进度，通常我们会监听 stderr 的输出并解析进度。
    // 这里简单起见，我们等待它完成并返回。
    let output = child.wait_with_output().map_err(|e| format!("ffmpeg 运行错误: {}", e))?;

    if output.status.success() {
        Ok(output_path)
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("ffmpeg 转换失败: {}", err_msg))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, get_system_info, convert_media_native])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
