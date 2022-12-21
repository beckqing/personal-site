function hover(spanId, elementList, className){
    document.getElementById(spanId).addEventListener('mouseenter', e => {
        for(let i=0; i<elementList.length; i++){
            elementList[i].classList.add(className)
        }
    })
    document.getElementById(spanId).addEventListener('mouseleave', e => {
        for(let i=0; i<elementList.length; i++){
            elementList[i].classList.remove(className)
        }
    })
}

let artIcons = document.getElementsByClassName('art')
let huIcons = document.getElementsByClassName('hu')
let sciIcons = document.getElementsByClassName('sci')

hover("span-art", artIcons, "art--hover")
hover("span-hu", huIcons, "hu--hover")
hover("span-sci", sciIcons, "sci--hover")