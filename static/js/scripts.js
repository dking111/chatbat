let socket;

window.onload = function() {
    const path = window.location.pathname;
    socket = new WebSocket("ws://" + window.location.host + "/ws");

    if (path === '/') {
        // Index page logic
        socket.onmessage = function(event) {
            let message = JSON.parse(event.data);
            switch (message["type"]) { 
                case "name_request_response": 
                    if (message["bool"]) {
                        localStorage.setItem("chatName", message["data"]);
                        localStorage.setItem("pfp", getPfp());
                        window.location.href = "/chat";
                    } else {
                        localStorage.setItem("chatName", null);
                        alert("Name already in use");
                    }
                    break;
            }
        };
        //Enter key
        document.getElementById("nameInput").addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                sendName();
            }
        });

    } else if (path === '/chat') {
        // Chat page logic
        const name = localStorage.getItem("chatName");
        const pfp = localStorage.getItem("pfp");
        if (name) {
            socket.onopen = function(event) {
                socket.send(JSON.stringify({type: "name_new", data: name, icon: pfp}));
            };

            socket.onmessage = function(event) {
                let message = JSON.parse(event.data);
                const messagesUl = document.getElementById("messages");
                if (messagesUl) {
                    const li = document.createElement("li");
                    switch (message["type"]) {
                        case "message_server":
                            li.innerHTML = `<b>${message.data}</b>`;
                            messagesUl.appendChild(li);
                            break;
                        case "message":
                            li.innerHTML = `<img src="/static/assets/${message.icon}.png" class="pfp"> ${message.data}`;
                            messagesUl.appendChild(li);
                            break;
                        //Highlight
                        case "message_mention":
                            li.innerHTML = `<img src="/static/assets/${message.icon}.png" class="pfp"> <mark>${message.data}</mark>`;
                            messagesUl.appendChild(li);
                            break;
                        //Italics
                        case "message_whisper":
                            li.innerHTML = `<img src="/static/assets/${message.icon}.png" class="pfp"> <i>${message.data}</i>`;
                            messagesUl.appendChild(li);
                            break;
                        case "name_request_response":
                            if (message["bool"]) {
                                localStorage.setItem("chatName", message["data"]);
                                socket.send(JSON.stringify({type: "name_change", data: message["data"], icon: pfp}));
                            } else {
                                alert("Name already taken");
                            }
                            break;
                    }
                    
                    // Ensure the list has at most 20 messages
                    while (messagesUl.getElementsByTagName("li").length > 20) {
                        messagesUl.removeChild(messagesUl.firstChild);
                    }
                }
            };

            socket.onclose = function(event) {
                console.log("Connection closed");
            };

            socket.onerror = function(error) {
                console.error("WebSocket error:", error);
            };

            document.getElementById("messageInput").addEventListener("keyup", function(event) {
                if (event.key === "Enter") {
                    sendMessage();
                }
            });

        } else {
            window.location.href = "/";  // Redirect to the name entry page if no name is found
        }
    }
};
//Retrieves selected pfp index page
function getPfp() {
    const selectedPfp = document.querySelector('input[name="pfpS"]:checked');
    if (selectedPfp) {
        return selectedPfp.value;
    }
    return null;
}
//Sets original name index
function sendName() {
    const nameInput = document.getElementById("nameInput");
    const name = nameInput.value;
    if (name) {
        socket.send(JSON.stringify({type: "name_request", data: name}));
    } else {
        alert("Name is required to join the chat.");
    }
}
//Sending message chat
function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value;
    if (message) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({type: "message", data: message}));
            messageInput.value = "";
        }
    }
}
//Chaning name chat
function changeName() {
    const nameInput = document.getElementById("messageInput");
    const name = nameInput.value;
    if (name) {
        socket.send(JSON.stringify({type: "name_request", data: name}));
        nameInput.value = "";
    } else {
        alert("Name cannot be empty");
    }
}
