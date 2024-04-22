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

if (typeof artIcons === 'undefined'){
    var artIcons = document.getElementsByClassName('art')
    var huIcons = document.getElementsByClassName('hu')
    var sciIcons = document.getElementsByClassName('sci')
}

hover("a-art", artIcons, "art--hover")
hover("a-hu", huIcons, "hu--hover")
hover("a-sci", sciIcons, "sci--hover")