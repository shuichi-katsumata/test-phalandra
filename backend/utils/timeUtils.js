const formatTime = (timeStr) => {
  if (timeStr && timeStr !== '0') {
    const [hours, minutes] = timeStr.split(':');
    const formattedHours = parseInt(hours, 10); //  hoursが09などの場合、parseInt()で先頭のゼロを落とす
    return `${formattedHours}:${minutes}`;
  } else {
    return '';
  }
}

module.exports = {
  formatTime,
}