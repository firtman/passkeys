const API = {
    endpoint: "/auth/",

    // TODO: Step 1

    // TODO: Step 6
    
    // TODO: Step 9

    makePostRequest: async (url, data) => {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

}

export default API;
