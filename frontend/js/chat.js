
let token = null;
let currentUser = null;
let conversations = [];
let currentConversation = null;
let websocket = null;
const conversationList=document.getElementById("conversation-list");
const messagesContainer=document.getElementById("messages-container");
const messageInput=document.getElementById("message-input");
const sendButton=document.getElementById("send-btn");
const logoutButton=document.getElementById("logout-btn");
const searchInput=document.getElementById("search-input");
const newConversationButton=document.getElementById("new-conversation-btn");
const username=document.getElementById("username");
const userAvatar=document.getElementById("user-avatar");

document.addEventListener("DOMContentLoaded", initialize);
logoutButton.addEventListener("click",logout);
async function initialize() {
    token=localStorage.getItem(TOKEN_KEY);
    if(!token){
        window.location.href = "login.html";
        return;
    }
    const response=await getCurrentUser(token);
    if(!response.ok){
        localStorage.removeItem(TOKEN_KEY);
        window.location.href="login.html";
        return;
    }
    currentUser=await response.json();
    username.textContent=currentUser.username;
    userAvatar.textContent=currentUser.username[0].toUpperCase();
    // console.log(currentUser);
    const conversationResponse=await getUserConversations(token);
    if(!response.ok){
        alert("Failed to load conversations.")
        return;
    }
    conversations=await conversationResponse.json();
    console.log(conversations);
    renderConversationList();
}

function logout(){
    localStorage.removeItem(TOKEN_KEY);
    setTimeout(()=>{
        window.location.href="login.html";
    },1500);
}

function renderConversationList(){
    conversationList.innerHTML="";
    conversations.forEach(conversation=>{
        const element=createConversationElement(conversation);
        conversationList.append(element);
    });
}
function createConversationElement(conversation){
    const item=document.createElement("div");
    const avatar=document.createElement("div");
    const info=document.createElement("div");
    const top=document.createElement("div");
    const bottom=document.createElement("div");
    const name=document.createElement("h3");
    const time=document.createElement("span");
    const lastMessage=document.createElement("p");
    const unreadBadge = document.createElement("span");
    item.className="conversation-item";
    avatar.className="conversation-avatar";
    info.className="conversation-info";
    top.className="conversation-top";
    bottom.className="conversation-bottom";
    name.className="conversation-name";
    time.className="conversation-time";
    lastMessage.className="last-message";
    unreadBadge.className = "unread-badge";
    item.dataset.conversationId=conversation.id;
    item.dataset.type=conversation.type;
    avatar.textContent=conversation.avatar;
    name.textContent=conversation.display_name;
    time.textContent=conversation.last_message_time??"...";
    lastMessage.textContent=conversation.last_message??"No message yet";

    bottom.appendChild(lastMessage);
    top.appendChild(name);
    top.appendChild(time);
    info.append(top);
    info.append(bottom);
    item.appendChild(avatar);
    item.appendChild(info);
    if (conversation.unread_count > 0) {
        unreadBadge.textContent = conversation.unread_count;
        bottom.appendChild(unreadBadge);
    }
    return item;
}



