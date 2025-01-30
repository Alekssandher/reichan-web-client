async function fetchPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const boardHeader = document.querySelector('.board-header h1');
    if (boardHeader) {
        boardHeader.textContent = category;  
    }
    const postId = urlParams.get('id');

    if (!postId) {
        document.getElementById('postContainer').innerHTML = '<div class="loading">Post not found.</div>';
        return;
    }

    try {
        const response = await fetch(`https://reichan-api.onrender.com/api/posts/find/${postId}`);
        const res = await response.json();
        const post = res.post;
        
        document.getElementById('postContainer').innerHTML = `
            <div class="post-header"><strong>${post.title}</strong></div>
            <div class="post-date">Published on: ${new Date(post.createdAt).toLocaleString('en-US')}</div>
            <img src="https://reichan-api.onrender.com/api/images/get/${post.category}/${post.image}" alt="Post image" class="post-image" onclick="toggleImageSize(this)">
            <div class="post-body">${post.text}</div>
        `;
        fetchReplies(postId);
    } catch (error) {
        console.error('Error fetching post:', error);
        document.getElementById('postContainer').innerHTML = '<div class="loading">Error loading post.</div>';
    }
}

async function fetchReplies(postId) {
    try {
        const response = await fetch(`https://reichan-api.onrender.com/api/replies/findAll?postId=${postId}`);
        const res = await response.json();
        const replies = res.replies;
        const container = document.getElementById('repliesContainer');
        
        if (replies.length === 0) {
            container.innerHTML = '<div class="loading">No replies found.</div>';
            return;
        }

        container.innerHTML = replies.map(reply => `
            <div class="reply">
                ${reply.image ? `<img src="https://reichan-api.onrender.com/api/images/get/${reply.category}/${reply.image}" 
                alt="${reply.image}" class="reply-image" onclick="toggleReplyImageSize(this)">` : ''}
                <div class="reply-body-container">
                    <div class="reply-date">Replied by: ${reply.author} on ${new Date(reply.createdAt).toLocaleString('en-US')}</div>
                    <div class="reply-body">${reply.text}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching replies:', error);
        document.getElementById('repliesContainer').innerHTML = '<div class="loading">Error loading replies.</div>';
    }
}

function toggleReplyImageSize(img) {
    const replyDiv = img.closest(".reply");

    if (img.classList.contains("enlarged")) {
        img.classList.remove("enlarged");
        img.style.maxWidth = "100px";
        replyDiv.classList.remove("expanded");
    } else {
        img.classList.add("enlarged");
        img.style.maxWidth = "100%";
        replyDiv.classList.add("expanded");
    }
}

function toggleImageSize(img) {
    img.style.transform = img.style.transform === 'scale(1.5)' ? 'scale(1)' : 'scale(1.5)';
}

document.getElementById('replyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('replyName').value.trim();
    const text = document.getElementById('replyText').value.trim();
    const imageInput = document.getElementById('replyImage');
    const repliesContainer = document.getElementById('replyAlert');

    if (!text) {
        repliesContainer.innerHTML = '<p style="color: red;">Please fill in all required fields.</p>';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    let category = '';

    try {
        const postResponse = await fetch(`https://reichan-api.onrender.com/api/posts/find/${postId}`);
        const postData = await postResponse.json();
        category = postData.post.category;
    } catch (error) {
        console.error('Error fetching post category:', error);
        repliesContainer.innerHTML = '<p style="color: red;">Error loading post data.</p>';
        return;
    }

    let fileName = ''; 

    if (imageInput.files[0]) {
        const formData = new FormData();
        formData.append('file', imageInput.files[0]);

        try {
            const response = await fetch(`https://reichan-api.onrender.com/api/images/upload?category=${category}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                fileName = result.fileName; 
            } else {
                repliesContainer.innerHTML = `<p style="color: red;">Error uploading image: ${result.message}</p>`;
                return;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            repliesContainer.innerHTML = '<p style="color: red;">Error uploading image. Please try again.</p>';
            return;
        }
    }

    try {
        await createReply(postId, name, text, fileName, category, repliesContainer);

        document.getElementById('replyForm').reset();
    } catch (error) {
        console.error('Error submitting reply:', error);
        repliesContainer.innerHTML = `<p style="color: red;">Error submitting reply: ${error.message}</p>`;
    }
});

async function createReply(postId, author, text, fileName, category, repliesContainer) {
    try {
        const response = await fetch(`https://reichan-api.onrender.com/api/replies/create/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                author: author,
                text: text,
                image: fileName || "", 
                category: category
            })
        });

        const contentType = response.headers.get('content-type');
        let result;

        if (contentType && contentType.includes('application/json')) {
            result = await response.json(); 
        } else {
            result = await response.text(); 
        }

        if (response.ok) {
            repliesContainer.innerHTML = `
                <p style="color: green;">
                    Reply submitted successfully!<br>
                    ${fileName ? `File: ${fileName}<br>` : ''}
                    Name: ${author}
                </p>
            `;

            fetchReplies(postId);
            return result;
        } else {
            console.error('Error creating reply:', result);
            throw new Error(result.message || result); 
        }
    } catch (error) {
        console.error('Error with server communication:', error);
        repliesContainer.innerHTML = `<p style="color: red;">Error submitting reply: ${error.message}</p>`;
        throw error; 
    }
}

window.addEventListener('load', fetchPost);
