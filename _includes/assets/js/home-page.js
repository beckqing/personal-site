function hover(aId, elementList, className){
    document.getElementById(aId).addEventListener('mouseenter', e => {
        for(let i=0; i<elementList.length; i++){
            elementList[i].classList.add(className)
        }
    })
    document.getElementById(aId).addEventListener('mouseleave', e => {
        for(let i=0; i<elementList.length; i++){
            elementList[i].classList.remove(className)
        }
    })
}

let artIcons = document.getElementsByClassName('art')
let huIcons = document.getElementsByClassName('hu')
let sciIcons = document.getElementsByClassName('sci')

hover("a-art", artIcons, "art--hover")
hover("a-hu", huIcons, "hu--hover")
hover("a-sci", sciIcons, "sci--hover")