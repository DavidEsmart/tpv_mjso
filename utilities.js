exports.craftearReferencia = () => {  
    return Date.now()
}

exports.parseBool = (value) => {
    return (typeof value === "undefined") ? 
           false : 
           // trim using jQuery.trim()'s source 
           value.replace(/^\s+|\s+$/g, "").toLowerCase() === "true";
}