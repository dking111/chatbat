from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Template rendering
templates = Jinja2Templates(directory="templates")

# Dictionary to store connected WebSocket clients and their names
websocket_clients = {}

# WebSocket endpoint for handling client connections
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        name = await websocket.receive_text()
        websocket_clients[websocket] = name
        # Notify all clients about the new connection
        for client in websocket_clients:
            await client.send_text(f"{name} has joined the chat!")
        
        while True:
            message = await websocket.receive_text()
            sender_name = websocket_clients[websocket]
            for client in websocket_clients:
                await client.send_text(f"{sender_name}: {message}")
    except WebSocketDisconnect:
        name = websocket_clients[websocket]
        del websocket_clients[websocket]
        # Notify all clients about the disconnection
        for client in websocket_clients:
            await client.send_text(f"{name} has left the chat.")

# Index route to serve the HTML page
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Chat route to serve the chat page
@app.get("/chat", response_class=HTMLResponse)
async def chat(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
