export default (data, type = 'text/xml') => {
  const parser = new DOMParser();
  return parser.parseFromString(data, type);
};
