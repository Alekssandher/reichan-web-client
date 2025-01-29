async function fetchPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        document.getElementById('postContainer').innerHTML = '<div class="loading">Post não encontrado.</div>';
        return;
    }

    try {
        const response = await fetch(`https://reichan-api.onrender.com/api/posts/find/${postId}`);
        const res = await response.json();
        const post = res.post;
        document.getElementById('postContainer').innerHTML = `
            <div class="post-header"><strong>${post.title}</strong></div>
            <div class="post-date">Publicado em: ${new Date(post.createdAt).toLocaleString('pt-BR')}</div>
            <img src="https://reichan-api.onrender.com/api/images/get/${post.category}/${post.image}" alt="Imagem do post" class="post-image" onclick="toggleImageSize(this)">
            <div class="post-body">${post.text}</div>
        `;
        fetchReplies(postId);
    } catch (error) {
        console.error('Erro ao buscar post:', error);
        document.getElementById('postContainer').innerHTML = '<div class="loading">Erro ao carregar post.</div>';
    }
}

async function fetchReplies(postId) {
    try {
        const response = await fetch(`https://reichan-api.onrender.com/api/replies/findAll?postId=${postId}`);
        const res = await response.json();
        const replies = res.replies;
        const container = document.getElementById('repliesContainer');
        
        if (replies.length === 0) {
            container.innerHTML = '<div class="loading">Nenhuma resposta encontrada.</div>';
            return;
        }

        container.innerHTML = replies.map(reply => `
            <div class="reply">
                ${reply.image ? `<img src="https://reichan-api.onrender.com/api/images/get/${reply.category}/${reply.image}" 
                alt="${reply.image}" class="reply-image" onclick="toggleReplyImageSize(this)">` : ''}
                <div class="reply-body-container">
                    <div class="reply-date">Respondido por: ${reply.author} em ${new Date(reply.createdAt).toLocaleString('pt-BR')}</div>
                    <div class="reply-body">${reply.text}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao buscar respostas:', error);
        document.getElementById('repliesContainer').innerHTML = '<div class="loading">Erro ao carregar respostas.</div>';
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

window.addEventListener('load', fetchPost);