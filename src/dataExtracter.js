import _ from 'lodash';

export default (element, feedId = _.uniqueId()) => {
  const rssEl = element.querySelector('rss');

  if (!rssEl) {
    throw new Error('Invalid RSS');
  }

  const feedTitle = element.querySelector('title');
  const feedDescription = element.querySelector('description');
  const feeds = {
    id: feedId,
    title: feedTitle.textContent,
    description: feedDescription.textContent,
  };

  const posts = [];
  const elementPosts = element.querySelectorAll('item');

  elementPosts.forEach((post) => {
    const postTitle = post.querySelector('title');
    const postDescription = post.querySelector('description');
    const urlRegex = /\bhttps?:\/\/\S+/;
    const postUrl = post.textContent.match(urlRegex)[0];
    const postId = _.uniqueId();

    posts.push({
      id: postId,
      feedId,
      title: postTitle.textContent,
      description: postDescription.textContent,
      link: postUrl,
      clicked: false,
    });
  });

  return [feeds, posts];
};
