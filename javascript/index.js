async function fetchPosts() {
    
    try {
        const response = await fetch('https://reichan-api.onrender.com/api/posts/findAll');
        const posts = await response.json();
        const limitedPosts = posts.posts.slice(0, 24);
        displayPosts(limitedPosts);
    } catch (error) {
        console.error('Erro finding posts:', error);
        document.getElementById('postsContainer').innerHTML = '<div class="loading">Error loading posts.</div>';
    }
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';

    posts.forEach((post, index) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        postElement.onclick = () => window.location.href = `pages/post.html?id=${post.id}&category=${post.category}`;
        
        let mediaElement = '';
        const fileExtension = post.image.split('.').pop().toLowerCase();
        if (["mp4", "webm", "ogg"].includes(fileExtension)) {
            mediaElement = `<video src="https://reichan-api.onrender.com/api/images/get/${post.category}/${post.image}" class="post-media" controls></video>`;
        } else {
            mediaElement = `<img src="https://reichan-api.onrender.com/api/images/get/${post.category}/${post.image}" alt="Post image" class="post-media">`;
        }
        let postLenght = post.replies.length
        postElement.innerHTML = `
            <div class="post-header">
                <span class="post-id">Id.${post.id}</span><br> 
                <strong>${post.title}</strong>
                <span class="post-category">${post.category}</span>
            </div>
            <div class="file-info">File: ${post.image.split('/').pop()}</div>
            ${mediaElement}
            <div class="post-body">${post.text}</div>
            <div class="replies">Respostas: ${postLenght} ▼</div>
            
        `;
        postsContainer.appendChild(postElement);
    });
}

async function uploadImage() {
    const category = document.getElementById('category').value;
    const file = document.getElementById('imageUpload').files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`https://reichan-api.onrender.com/api/images/upload?category=${encodeURIComponent(category)}`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    createPost(data.fileName);
}

async function createPost(imageName) {
    const post = {
    title: document.getElementById('title').value.trim(),
    image: imageName, 
    text: document.getElementById('text').value.trim(),
    category: document.getElementById('category').value
    };

    if (!post.title || !post.text) {
    alert("Fill all the fields to post.");
    return;
    }

    try {
    const response = await fetch('https://reichan-api.onrender.com/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
    });

    if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    alert("Post created!");
    fetchPosts();
    } catch (error) {
    console.error("Eror creating post:", error);
    alert("Fail to create post, did you select an image or a video?.");
    }
}
window.addEventListener('load', fetchPosts);