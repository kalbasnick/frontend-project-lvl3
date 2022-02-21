/* eslint-disable import/extensions */
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import parseData from './parser.js';
import watchState from './view.js';
import resources from './locales/index.js';

const makeProxyUrl = (url) => {
  const proxy = new URL('https://hexlet-allorigins.herokuapp.com/get?disableCache=true');
  proxy.searchParams.set('url', url);

  console.log(proxy.searchParams.get('url'));
  return proxy.href;
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    });

  yup.setLocale({
    mixed: {
      required: i18nextInstance.t('validationError.notUrl'),
      notOneOf: i18nextInstance.t('validationError.alreadyExists'),
    },
    string: {
      url: i18nextInstance.t('validationError.notUrl'),
    },
  });

  const state = {
    form: {
      processState: 'filling',
      valid: false,
      error: [],
    },
    data: {
      feeds: [],
      posts: [],
    },
    uiState: {
      posts: [],
    },
  };

  const watchedState = watchState(document, state, i18nextInstance);
  const form = document.querySelector('.rss-form');
  const postsEl = document.querySelector('.posts');

  const checkDataUpdates = () => {
    const updatedFeeds = state.data.feeds.forEach((feed) => {
      axios.get(makeProxyUrl(feed.url))
        .then((responce) => {
          const loadedData = responce.data.contents;
          const parsedData = parseData(loadedData);
          const { postsData } = parsedData;

          const extractedUpdatedPosts = postsData
            .map((post) => ({ ...post, feedId: feed.id, id: _.uniqueId() }));

          const currentPostsTitlesOfFeed = state.data.posts
            .filter((post) => post.feedId === feed.id)
            .map((post) => post.title);

          const updatedPosts = extractedUpdatedPosts
            .filter((updatedPost) => !currentPostsTitlesOfFeed.includes(updatedPost.title))
            .map((updatedPost) => {
              state.uiState.posts.push({ postId: updatedPost.id, clicked: false });

              return updatedPost;
            });

          watchedState.data.posts = [...state.data.posts, ...updatedPosts];
        });
    });

    Promise.all([updatedFeeds])
      .then(() => setTimeout(() => checkDataUpdates(), 5000));
  };

  checkDataUpdates();

  if (!form || !postsEl) {
    return;
  }

  postsEl.addEventListener('click', (event) => {
    const clickedEl = event.target;
    if (clickedEl.dataset.bsToggle === 'modal' || clickedEl.tagName === 'A') {
      const clickedElId = clickedEl.getAttribute('data-id');
      const updatedUiStatePosts = state.uiState.posts
        .map((el) => (el.postId === clickedElId ? { ...el, clicked: true } : el));

      watchedState.uiState.posts = updatedUiStatePosts;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    const feedsLog = state.data.feeds.map((feed) => feed.url);
    const schema = (data) => yup.string().url().required().notOneOf(data);
    schema(feedsLog).validate(url)
      .then(() => {
        state.form.error = [];
        state.form.valid = true;
        watchedState.form.processState = 'sending';
        axios.get(makeProxyUrl(url))
          .then((responce) => {
            const loadedData = responce.data.contents;
            const parsedData = parseData(loadedData);
            const { feedData, postsData } = parsedData;

            const feedId = _.uniqueId();
            const feed = { ...feedData, url, id: feedId };
            const posts = postsData.map((post) => {
              const postId = _.uniqueId();
              state.uiState.posts.push({ postId, clicked: false });

              return { ...post, feedId, id: postId };
            });

            watchedState.data = {
              feeds: [...state.data.feeds, feed],
              posts: [...state.data.posts, ...posts],
            };

            watchedState.form.processState = 'proceed';
            form.reset();
            form.focus();
          })
          .catch((err) => {
            state.form.error = err;
            state.form.valid = false;
            watchedState.form.processState = 'loadingError';
          });
      })
      .catch((err) => {
        state.form.error = err.errors;
        state.form.valid = false;
        watchedState.form.processState = 'validationError';
      });
  });
};
