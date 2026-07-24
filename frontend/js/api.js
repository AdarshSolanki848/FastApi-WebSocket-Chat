
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