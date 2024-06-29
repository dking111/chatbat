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
                        window.location.href = "/chat";
                    } else {
                        localStorage.setItem("chatName", null);
                        alert("Name already in use");
                    }
                    break;
            }
        }
    } else if (path === '/chat') {
        // Chat page logic
        const name = localStorage.getItem("chatName");
        if (name) {
            socket.onopen = function(event) {
                socket.send(JSON.stringify({type: "name_new", data: name}));
            };

            socket.onmessage = function(event) {
                let message = JSON.parse(event.data)
                const messagesUl = document.getElementById("messages");
                if (messagesUl) {
                    const li = document.createElement("li");
                    switch(message["type"]){
                        case "message_server":
                            li.innerHTML = `<b>${message.data}</b>`;
                            messagesUl.appendChild(li);
                            break;
                        case "message":
                            li.innerText = message["data"];
                            messagesUl.appendChild(li);
                            break;
                        case "name_request_response":
                            if (message["bool"]){
                                localStorage.setItem("chatName", message["data"]);
                                socket.send(JSON.stringify({type: "name_change", data: message["data"]}));
                            }
                            else{
                                alert("Name already taken")
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

        } else {
            window.location.href = "/";  // Redirect to the name entry page if no name is found
        }
    }
};

function sendName(){
    var nameInput = document.getElementById("nameInput");
    var name = nameInput.value;
    if (name) {
        socket.send(JSON.stringify({type: "name_request", data: name}));
    } else {
        alert("Name is required to join the chat.");
    }
}

function sendMessage(){
    var messageInput = document.getElementById("messageInput");
    var message = messageInput.value;
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({type: "message", data: message}));
        messageInput.value = "";
    }
}

function changeName(){
    var nameInput = document.getElementById("messageInput");
    var name = nameInput.value;
    
    if (name) {
        socket.send(JSON.stringify({type: "name_request", data: name}));
        nameInput.value = "";
        
    } 
    else {
        alert("Name cannot be empty");
    }
}
