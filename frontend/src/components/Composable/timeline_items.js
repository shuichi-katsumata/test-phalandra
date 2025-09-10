export const timelineItems =[
  { value: 0, label: '--:--'},
  ...Array.from({ length: 37 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6; // 6:00からスタート
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedHour = hour.toString().padStart(2, '0');
    return { value: `${formattedHour}:${minute}`, label: `${hour.toString().padStart(2, '0')}:${minute}` };
  })
];