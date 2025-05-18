// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::accept_async;

#[tauri::command]
async fn start_websocket_server() -> Result<(), String> {
    let addr = "127.0.0.1:9002";
    let socket = TcpListener::bind(&addr).await.map_err(|e| e.to_string())?;
    
    tauri::async_runtime::spawn(async move {
        while let Ok((stream, _)) = socket.accept().await {
            tauri::async_runtime::spawn(handle_connection(stream));
        }
    });
    
    Ok(())
}

async fn handle_connection(stream: TcpStream) {
    let ws_stream = accept_async(stream).await.expect("Failed to accept");
    let (mut write, mut read) = ws_stream.split();
    
    while let Some(msg) = read.next().await {
        let msg = msg.expect("Failed to read message");
        if msg.is_text() || msg.is_binary() {
            write.send(msg).await.expect("Failed to send message");
        }
    }
}

fn main() {
    tauri::async_runtime::spawn(async {
        if let Err(e) = start_websocket_server().await {
            eprintln!("Failed to start WebSocket server: {}", e);
        }
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_websocket_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
