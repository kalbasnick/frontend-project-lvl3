import _ from 'lodash';

const useRegexOnString = (str, regex) => {
  const result = str.match(regex);

  return result === null ? str : result[0];
};

export default (element, feedId) => {
  const rssEl = element.querySelector('rss');
  if (!rssEl) {
    throw new Error('Invalid RSS');
  }

  const feedTitle = element.querySelector('title');
  const feedDescription = element.querySelector('description');
  const dataFromCdataRegex = /(?<=<!\[CDATA\[)(.*)(?=\]\]>)/;
  const feeds = {
    id: feedId,
    title: useRegexOnString(feedTitle.textContent, dataFromCdataRegex),
    description: useRegexOnString(feedDescription.textContent, dataFromCdataRegex),
  };

  const posts = [];
  const elementPosts = element.querySelectorAll('item');

  elementPosts.forEach((post) => {
    const postTitle = post.querySelector('title');
    const urlFromTextRegex = /\bhttps?:\/\/\S+/;
    const postUrl = useRegexOnString(post.textContent, urlFromTextRegex);
    const postId = _.uniqueId();

    posts.push({
      id: postId,
      feedId,
      title: useRegexOnString(postTitle.textContent, dataFromCdataRegex),
      link: postUrl,
    });
  });

  return [feeds, posts];
};
