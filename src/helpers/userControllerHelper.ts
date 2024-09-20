export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return (
    date.getFullYear() > 0 &&
    date.getDate() === parseInt(dateString.split('-')[2], 10) &&
    date.getMonth() === parseInt(dateString.split('-')[1], 10) - 1
  );
};
