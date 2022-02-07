export default (data, type = 'text/xml') => {
  const parser = new DOMParser();
  const element = parser.parseFromString(data, type);

  const rssEl = element.querySelector('rss');

  if (!rssEl) {
    throw new Error('Invalid RSS');
  }

  const feedTitle = element.querySelector('title');
  const feedDescription = element.querySelector('description');
  const feedData = {
    title: feedTitle.textContent,
    description: feedDescription.textContent,
  };

  const postsData = [];
  const elementPosts = element.querySelectorAll('item');

  elementPosts.forEach((post) => {
    const postTitle = post.querySelector('title');
    const postDescription = post.querySelector('description');
    const urlRegex = /\bhttps?:\/\/\S+/;
    const postUrl = post.textContent.match(urlRegex)[0];

    postsData.push({
      title: postTitle.textContent,
      description: postDescription.textContent,
      link: postUrl,
    });
  });

  return { feedData, postsData };
};
