// Film posters from local folder
const filmPosters = [
    "film afişleri/MV5BMzQxNzQzOTQwM15BMl5BanBnXkFtZTgwMDQ2NTcwODM@._V1_SX300.jpg",
    "film afişleri/MV5BNzA3ZjZlNzYtMTdjMy00NjMzLTk5ZGYtMTkyYzNiOGM1YmM3XkEyXkFqcGc@._V1_SX300.jpg",
    "film afişleri/MV5BYmNhOWMyNTYtNTljNC00NTU3LWFiYmQtMDBhOGU5NWFhNGU5XkEyXkFqcGc@._V1_SX300.jpg",
    "film afişleri/MV5BMTU4NDg0MzkzNV5BMl5BanBnXkFtZTgwODA3Mzc1MDE@._V1_SX300.jpg",
    "film afişleri/MV5BZWMyZjkzMDItZWM1NS00ODA2LTg3NjYtMjgxMzY1ZjAzYTQwXkEyXkFqcGc@._V1_SX300.jpg",
    "film afişleri/MV5BYWFmMjdmNjctNzhhOC00ZmMzLTkwOGItMmVmZDU4MjE2MTYwXkEyXkFqcGc@._V1_SX300.jpg",
    "film afişleri/MV5BNzYyODQyODAyOV5BMl5BanBnXkFtZTgwMzc4MzczOTE@._V1_SX300.jpg",
    "film afişleri/MV5BNmQxMTI1YmEtOGY3Yi00NzVlLWEzMjAtYTI1NWZkNDFiMDg1XkEyXkFqcGc@._V1_SX300.jpg"
];

function createImageGallery() {
    let imageHTML = '<div class="image-container">';
    
    for (let i = 0; i < 50; i++) {
        filmPosters.forEach(posterUrl => {
            imageHTML += `<img src="${posterUrl}" style="
                width: 190px; 
                height: 190px; 
                margin: 0; 
                object-fit: cover; 
                border-radius: 5px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(255,255,255,0.1); 
                display: inline-block;
                opacity: 0.9;
                transition: opacity 0.3s ease;
                filter: brightness(1.1) contrast(1.4);
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">`;
        });
    }
    
    imageHTML += '</div>';
    return imageHTML;
}

function insertImagesIntoDivs() {
    const textDivs = document.querySelectorAll(".text");
    textDivs.forEach((div) => {
        div.innerHTML = createImageGallery();
    });
}

document.addEventListener("DOMContentLoaded", insertImagesIntoDivs);

const contentDiv = document.querySelector(".content");
function adjustContentSize() {
	const viewportWidth = window.innerWidth;
	const baseWidth = 1000;
	const scaleFactor =
		viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.8 : 1;
	contentDiv.style.transform = `scale(${scaleFactor})`;
}
window.addEventListener("load", adjustContentSize);
window.addEventListener("resize", adjustContentSize); 