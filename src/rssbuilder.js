import _ from 'lodash';

export default (element) => {
  const rssEl = element.querySelector('rss');
  if (!rssEl) {
    throw new Error('Invalid RSS');
  }

  const feedTitle = element.querySelector('title');
  const feedDescription = element.querySelector('description');
  const feedId = _.uniqueId();

  const feeds = {
    id: feedId,
    title: feedTitle.textContent,
    description: feedDescription.textContent,
  };

  const posts = [];
  const elementPosts = element.querySelectorAll('item');

  elementPosts.forEach((post) => {
    const postTitle = post.querySelector('title');
    const postUrl = post.textContent.match(/\bhttps?:\/\/\S+/gi);
    const postId = _.uniqueId();

    posts.push({
      id: postId,
      feedId,
      title: postTitle.textContent,
      link: postUrl[0],
    });
  });

  return [feeds, posts];
};
