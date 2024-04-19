// Create a note 
// const createNote = document.querySelector(".create-note-container");
// const createBtn = document.querySelector(".create-btn");
// const closeBtn = document.querySelector(".close-btn");

// createBtn.addEventListener("click", function() {
//     createNote.style.display = "block"; 
// })

// closeBtn.addEventListener("click", function() {
//     createNote.style.display = "none"; 
// })


// Color picker (pickr js)

const pickr = Pickr.create({
    el: '.color-picker',
    theme: 'nano', 

    swatches: [
        '#303131',
    ],

    components: {

        // Main components
        preview: true,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
            input: true
        }
    }
});

// pickr.on('change', (color, source, instance) => {
//     const selectedColor = color.toHEXA().toString();
    
//     document.querySelector(".create-note-container").style.backgroundColor = selectedColor;
//     document.querySelector(".note-color").value = selectedColor;    // passing this value in database
    
// })


// Adding colors to the note boxes (getting data from backend) using custom attribute
document.querySelectorAll('.note-box').forEach(function(note) {

    const noteColor = note.dataset.noteColor;

    note.style.backgroundColor = noteColor;

});

console.log("hi");
