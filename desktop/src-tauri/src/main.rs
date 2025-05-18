// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use once_cell::sync::Lazy;

type Clients = Arc<Mutex<HashMap<usize, mpsc::UnboundedSender<Message>>>>;

static CLIENTS: Lazy<Clients> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
static CLIENT_COUNTER: Lazy<Arc<Mutex<usize>>> = Lazy::new(|| Arc::new(Mutex::new(0)));

#[tauri::command]
async fn start_websocket_server() -> Result<(), String> {
    let addr = "127.0.0.1:9002";
    let socket = TcpListener::bind(&addr).await.map_err(|e| e.to_string())?;
    
    println!("WebSocket server listening on: {}", addr);
    
    tauri::async_runtime::spawn(async move {
        while let Ok((stream, addr)) = socket.accept().await {
            println!("New WebSocket connection: {}", addr);
            
            let client_id = {
                let mut counter = CLIENT_COUNTER.lock().unwrap();
                let id = *counter;
                *counter += 1;
                id
            };
            
            tauri::async_runtime::spawn(handle_connection(stream, client_id));
        }
    });
    
    Ok(())
}

async fn handle_connection(stream: TcpStream, id: usize) {
    let ws_stream = accept_async(stream).await.expect("Failed to accept");
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    
    let (tx, mut rx) = mpsc::unbounded_channel();
    
    {
        let mut clients = CLIENTS.lock().unwrap();
        clients.insert(id, tx);
        println!("Client {} connected", id);
    }
    
    let forward_task = tauri::async_runtime::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                break;
            }
        }
    });
    
    while let Some(result) = ws_receiver.next().await {
        match result {
            Ok(msg) => {
                println!("Received message from client {}: {:?}", id, msg);
                let clients_map = CLIENTS.lock().unwrap();
                for (client_id, client) in clients_map.iter() {
                    if *client_id != id {
                        let _ = client.send(msg.clone());
                    }
                }
            }
            Err(e) => {
                eprintln!("Error from client {}: {}", id, e);
                break;
            }
        }
    }
    
    {
        let mut clients = CLIENTS.lock().unwrap();
        clients.remove(&id);
        println!("Client {} disconnected", id);
    }
    
    let _ = forward_task.await;
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
