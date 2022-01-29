import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import parseData from './parser';
import watchState from './view';
import resources from './locales/index';
import extractData from './dataExtracter';

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance
    .init({
      lng: 'ru',
      debug: 'false',
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

  const schema = (data) => yup.string().url().required().notOneOf(data);

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
  };

  const state = {
    form: {
      value: '',
      processState: 'filling',
      valid: false,
      error: [],
    },
    data: {
      feeds: [],
      posts: [],
    },
  };

  const watchedState = watchState(state, i18nextInstance);

  elements.input.addEventListener('change', (e) => {
    state.form.processState = 'filling';
    const { value } = e.target;
    const feedsLog = state.data.feeds.map((feed) => feed.url);
    schema(feedsLog).validate(value)
      .then(() => {
        state.form.error = [];
        state.form.valid = true;
      })
      .catch((err) => {
        state.form.error = err.errors;
        state.form.valid = false;
      })
      .then(() => {
        state.form.value = value;
      });
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url-input');

    if (!state.form.valid) {
      watchedState.form.processState = 'validationError';
    }

    if (state.form.valid) {
      watchedState.form.processState = 'sending';
      const makeProxyUrl = (address) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(address)}`;
      axios.get(makeProxyUrl(url))
        .then((responce) => {
          const loadedData = responce.data.contents;
          const parsedData = parseData(loadedData);
          const [extractedFeed, extractedPosts] = extractData(parsedData);
          const feed = { ...extractedFeed, url };

          watchedState.data = {
            feeds: [...state.data.feeds, feed],
            posts: [...state.data.posts, ...extractedPosts],
          };

          const postsElement = document.querySelector('.posts');
          postsElement.addEventListener('click', (event) => {
            const clickedElement = event.target;
            if (clickedElement.dataset.bsToggle === 'modal' || clickedElement.tagName === 'A') {
              const postId = clickedElement.getAttribute('data-id');
              const newPosts = state.data.posts.reduce((acc, post) => {
                acc.push(post.id === postId ? { ...post, clicked: true } : post);

                return acc;
              }, []);

              watchedState.data = {
                feeds: state.data.feeds,
                posts: newPosts,
              };
            }
          });
        })
        .catch((error) => {
          state.form.error = error;
          watchedState.form.processState = 'loadingError';
          throw error;
        })
        .then(() => {
          watchedState.form.processState = 'proceed';
          elements.form.reset();
          elements.form.focus();
        })
        .then(() => {
          if (state.data.feeds.length > 0) {
            state.data.feeds.forEach((feed) => {
              const checkDataUpdates = () => setTimeout(() => axios.get(makeProxyUrl(feed.url))
                .then((updatedResponce) => {
                  const loadedUpdatedData = updatedResponce.data.contents;
                  const parsedUpdatedData = parseData(loadedUpdatedData);
                  const [, extractedUpdatedPosts] = extractData(parsedUpdatedData, feed.id);

                  const currentPosts = state.data.posts
                    .filter((post) => post.feedId === feed.id)
                    .map((post) => post.title);

                  const updatedPosts = extractedUpdatedPosts
                    .filter((updatedPost) => !currentPosts.includes(updatedPost.title));

                  if (updatedPosts.length > 0) {
                    watchedState.data = {
                      feeds: state.data.feeds,
                      posts: [...state.data.posts, ...updatedPosts],
                    };
                  }

                  checkDataUpdates();
                }), 5000);

              checkDataUpdates();
            });
          }
        });
    }
  });
};
