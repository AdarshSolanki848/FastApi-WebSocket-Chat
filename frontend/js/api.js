
async function register(username,password) {
    const response=await fetch(`${API_BASE}/auth/register`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            username,password
        })

    });
    return response;
}

async function login(username,password) {
    const formData= new URLSearchParams();
    formData.append("username",username);
    formData.append("password",password);
    const response=await fetch(`${API_BASE}/auth/login`,{
        method:"POST",
        headers:{
            "Content-Type":"application/x-www-form-urlencoded"
        },
        body: formData
    });
    return response;
}

async function getCurrentUser(token) {
    const response=await fetch(`${API_BASE}/auth/me`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`
        }
    });
    return response;
}

async function getUserConversations(token) {
    return await fetch(`${API_BASE}/conversations`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`
        }
    });
}

async function getConversationMessages(token,conversationId) {
    return await fetch(`${API_BASE}/conversations/${conversationId}/messages`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`
        }
    });
}

async function deleteConversation(token,conversationId){
    return await fetch(`${API_BASE}/conversations/${conversationId}`,{
        method:"DELETE",
        headers:{
            "Authorization": `Bearer ${token}`
        }
    });
}

async function getUsers(token) {
    return await fetch(`${API_BASE}/users`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

async function createPrivateConversation(token, userId) {
    return fetch(`${API_BASE}/conversations/private`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: userId
        })
    });
}

async function createGroupConversation(token, name, memberIds) {
    return fetch(`${API_BASE}/conversations/group`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            name,
            member_ids: memberIds
        })
    });
}

async function addMembers(token,conversation_id,memberIds) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/members`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            member_ids: memberIds
        })
    });
}

async function getAvailableUsers(token,conversation_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/availableusers`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });
}

async function getConversationMembers(token,conversation_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/members`,{
        headers:{
            Authorization: `Bearer ${token}`
        }
    });
    
}

async function removeConversationMember(token,conversation_id,member_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/members/${member_id}`,{
        method:"DELETE",
        headers:{
            "Authorization": `Bearer ${token}`
        }
    });
}

async function leaveTheGroup(token,conversation_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/leave`,{
        method:"DELETE",
        headers:{
            "Authorization": `Bearer ${token}`
        }
    });
}

async function updateGroupName(token,conversation_id,name) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/name`,{
        method:"PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name: name
        })
    });
}

async function callMakeAdmin(token,conversation_id,member_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/make_admins`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id:member_id
        })
    });
}

async function callDemoteAdmin(token,conversation_id,member_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/demote_admins`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id:member_id
        })
    });
}

async function deleteMessageForMe(token,conversation_id,message_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/messages/${message_id}/delete_for_me`,{
        method:"DELETE",
        headers:{
            "Authorization": `Bearer ${token}`
        }   
    });
}
async function deleteMessageForEveryone(token,conversation_id,message_id) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/messages/${message_id}/delete_for_everyone`,{
        method:"DELETE",
        headers:{
            "Authorization": `Bearer ${token}`
        }   
    });
}

async function editMessageRequest(token,conversation_id,message_id,content) {
    return fetch(`${API_BASE}/conversations/${conversation_id}/messages/${message_id}/edit_message`,{
        method:"PATCH",
        headers:{
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content:content
        })   
    });
}

async function uploadImageRequest(token, conversation_id, file) {
    const formData = new FormData();
    formData.append("file", file);

    return fetch(
        `${API_BASE}/conversations/${conversation_id}/images`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        }
    );
}