const BASE_URL = "http://127.0.0.1:8000";

async function register(username,password) {
    const response=await fetch(`${BASE_URL}/auth/register`,{
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
    const response=await fetch(`${BASE_URL}/auth/login`,{
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