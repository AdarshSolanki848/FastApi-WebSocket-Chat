const socket=new WebSocket("ws://127.0.0.1:8000/ws")

const messageInput=document.getElementById("messageInput");
const usernameInput=document.getElementById("username")
const sendBtn=document.getElementById("sendBtn");
const messages=document.getElementById("messages");
const joinBtn=document.getElementById("joinBtn")
const onlineCount=document.getElementById("onlineCount");
const joinText=document.getElementById("joinText");
const joinSpinner=document.getElementById("joinSpinner");
const typingIndicator=document.getElementById("typingIndicator")
const typingText=document.getElementById("typingText");

let username="";
let tempusername="";
let isTyping=false;
let typingTimeout=null;
const typingUsers=new Set();

joinBtn.addEventListener('click',()=>{
    tempusername=usernameInput.value.trim();
    if(tempusername==="")return;
    const joined_data={
        type:"user_joined",
        username:tempusername
    };
    setJoiningState();
    socket.send(JSON.stringify(joined_data));
    
});

socket.onopen=()=>{
    console.log("Connected!");
};

sendBtn.addEventListener('click',()=>{
    if(username===""){
        alert("⚠️Please enter your username!");
        return;
    }
    const Message=messageInput.value.trim();
    if(Message==="")return;
    const data={
        type:"chat",
        message:Message
    };

    socket.send(JSON.stringify(data));
    messageInput.value="";
});

messageInput.addEventListener("input",()=>{
    if(!isTyping){
        isTyping=true;
        socket.send(JSON.stringify({type:"typing"}));
    }
    clearTimeout(typingTimeout);
    typingTimeout=setTimeout(()=>{
        isTyping=false;
        socket.send(JSON.stringify({type:"stopped_typing"}));
    },2000);

});


socket.onmessage=(event)=>{
    const data=JSON.parse(event.data)
    switch(data.type){
        case "chat":{
            addMessage(data);
            break;
        }
        case "user_joined":{
            userJoinedMessage(data);
            break;
        }
        case "online_count":{
            updateOnlineCount(data);
            break;
        }
        case "user_left":{
            userLeftMessage(data);
            break;
        }
        case "join_failed":{
            joinFailed(data);
            break;
        }
        case "typing":{
            addTypingUser(data);
            break;
        }
        case "stopped_typing":{
            removeTypingUser(data);
            break;
        }
        default:
            console.warn("Unknown message type:", data.type);      
    }
};


function addMessage(data){
    const div=document.createElement("div");
    div.className="message";
    div.textContent=`${data.username}: ${data.message}`;
    if(username===data.username)div.classList.add("mine");
    
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function userJoinedMessage(data){
    if(tempusername===data.username){
        username=tempusername;
        setJoinedState();
        return;
    }
    const user_joined=document.createElement("div");
    const user_joined_container=document.createElement("div");
    user_joined.className="user-joined";
    user_joined_container.className="user-joined-container";
    user_joined.textContent=`${data.username} has joined`;
    user_joined_container.appendChild(user_joined);
    messages.appendChild(user_joined_container);
    messages.scrollTop = messages.scrollHeight;
}
function userLeftMessage(data){
    if(data.username===username)return;
    typingUsers.delete(data.username);
    updateTypingIndicator();
    const user_left=document.createElement("div");
    const user_left_container=document.createElement("div");
    user_left.className="user-left";
    user_left_container.className="user-left-container";
    user_left.textContent=`${data.username} has left`;
    user_left_container.appendChild(user_left);
    messages.appendChild(user_left_container);
    messages.scrollTop = messages.scrollHeight;
}

function updateOnlineCount(data){
    onlineCount.textContent=`🟢 ${data.count} Online`;
}

function joinFailed(data){
    alert(data.message);
    resetJoinState();
}

function setJoiningState(){
    joinBtn.disabled = true;
    usernameInput.disabled = true;
    joinText.textContent="Joining...";
    joinSpinner.classList.remove("hidden");
}

function setJoinedState(){
    joinBtn.disabled = true;
    joinBtn.classList.add("joined");
    joinText.textContent="Joined✔️";
    usernameInput.disabled=true;
    joinSpinner.classList.add("hidden");
}

function resetJoinState(){
    joinBtn.disabled = false;
    joinBtn.classList.remove("joined");
    joinText.textContent="Join";
    usernameInput.disabled=false;
    joinSpinner.classList.add("hidden");
}

function addTypingUser(data){
    if(data.username==username)return;
    typingUsers.add(data.username);
    updateTypingIndicator();
}

function removeTypingUser(data){
    
    if(data.username==username)return;
    typingUsers.delete(data.username);
    updateTypingIndicator();
}

function updateTypingIndicator(){
    const users=[...typingUsers];
    if(users.length===0){
        typingText.textContent="";
        typingIndicator.classList.add("hidden");
        return;
    }
    typingIndicator.classList.remove("hidden");
    switch(users.length){
        case 1:{
            typingText.textContent=`${users[0]} is typing`;
            break;
        }
        case 2:{
            typingText.textContent=`${users[0]} and ${users[1]} are typing`;
            break;
        }   
        default:
            typingText.textContent=`${users.length} users are typing`;
    }
}


