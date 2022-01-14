export default (data, type = 'text/html') => {
  const parser = new DOMParser();
  return parser.parseFromString(data, type);
};
