async function fetchPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const boardHeader = document.querySelector('.board-header h1');
    if (boardHeader) {
        boardHeader.textContent = category;  
    }
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

document.getElementById('replyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('replyName').value.trim();
    const text = document.getElementById('replyText').value.trim();
    const imageInput = document.getElementById('replyImage');
    const repliesContainer = document.getElementById('replyAlert');

    if (!text) {
        repliesContainer.innerHTML = '<p style="color: red;">Preencha todos os campos obrigatórios.</p>';
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
        console.error('Erro ao buscar categoria do post:', error);
        repliesContainer.innerHTML = '<p style="color: red;">Erro ao carregar dados do post.</p>';
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
                repliesContainer.innerHTML = `<p style="color: red;">Erro ao enviar imagem: ${result.message}</p>`;
                return;
            }
        } catch (error) {
            console.error('Erro ao enviar imagem:', error);
            repliesContainer.innerHTML = '<p style="color: red;">Erro ao enviar imagem. Tente novamente.</p>';
            return;
        }
    }

    try {
        await createReply(postId, name, text, fileName, category, repliesContainer);

        document.getElementById('replyForm').reset();
    } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        repliesContainer.innerHTML = `<p style="color: red;">Erro ao enviar resposta: ${error.message}</p>`;
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
                    Resposta enviada com sucesso!<br>
                    ${fileName ? `Arquivo: ${fileName}<br>` : ''}
                    Nome: ${author}
                </p>
            `;

            fetchReplies(postId);
            return result;
        } else {
            console.error('Erro ao criar resposta:', result);
            throw new Error(result.message || result); 
        }
    } catch (error) {
        console.error('Erro na comunicação com o servidor:', error);
        repliesContainer.innerHTML = `<p style="color: red;">Erro ao enviar resposta: ${error.message}</p>`;
        throw error; 
    }
}

window.addEventListener('load', fetchPost);