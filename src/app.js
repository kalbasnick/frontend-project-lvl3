import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import parseData from './parser';
import resources from './locales/index';
import extractData from './rssbuilder';

const renderData = ({ feeds, posts }, [dataName1, dataName2]) => {
  const buildCardEl = (name) => {
    const card = document.createElement('div');
    card.classList.add('card');
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    const feedsTitle = document.createElement('h2');
    feedsTitle.classList.add('card-title');
    feedsTitle.textContent = name;
    cardBody.append(feedsTitle);
    card.append(cardBody);

    return card;
  };

  const newFeedsCard = buildCardEl(dataName1);
  const newPostsCard = buildCardEl(dataName2);

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group');
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');

  feeds.forEach((feed) => {
    const feedLiEl = document.createElement('li');
    feedLiEl.classList.add('list-group-item');

    const feedTitle = document.createElement('h3');
    const feedDescription = document.createElement('p');
    feedTitle.textContent = feed.title;
    feedDescription.textContent = feed.description;

    feedLiEl.append(feedTitle, feedDescription);
    feedsList.append(feedLiEl);

    posts.forEach((post) => {
      if (post.feedId === feed.id) {
        const postLiEl = document.createElement('li');
        postLiEl.classList.add('list-group-item');

        const postAEl = document.createElement('a');
        postAEl.setAttribute('href', post.link);
        postAEl.setAttribute('data-id', post.id);
        postAEl.textContent = post.title;

        const postButton = document.createElement('button');
        postButton.setAttribute('type', 'button');
        postButton.setAttribute('data-id', post.id);
        postButton.classList.add('btn', 'btn-outline-primary');
        postButton.textContent = 'Просмотр';

        postLiEl.append(postAEl, postButton);
        postsList.append(postLiEl);
      }
    });
  });

  newFeedsCard.append(feedsList);
  newPostsCard.append(postsList);
  return [newFeedsCard, newPostsCard];
};

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

  const form = document.querySelector('.rss-form');
  const input = document.querySelector('#url-input');
  const submitButton = document.querySelector('[type="submit"]');
  const feedback = document.querySelector('.feedback');

  const state = {
    form: {
      value: '',
      processState: 'filling',
      valid: false,
      error: [],
    },
    feedsLog: [],
    data: {
      feeds: [],
      posts: [],
    },
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'form.processState') {
      if (value === 'proceed') {
        input.classList.remove('is-invalid');
        feedback.textContent = i18nextInstance.t('proceed');
        feedback.classList.add('text-success');
        feedback.classList.remove('text-danger');
        submitButton.disabled = false;
      }
      if (value === 'sending') {
        submitButton.disabled = true;
        feedback.textContent = '';
      }
      if (value === 'validationError') {
        submitButton.disabled = false;
        input.classList.add('is-invalid');
        feedback.classList.add('text-danger');
        feedback.textContent = state.form.error;
      }
      if (value === 'loadingError') {
        submitButton.disabled = false;
        feedback.classList.add('text-danger');
        if (state.form.error.message === 'Invalid RSS') {
          feedback.textContent = i18nextInstance.t('invalidRssError');
        }
        if (state.form.error.message === 'Network Error') {
          feedback.textContent = i18nextInstance.t('networkError');
        }
      }
    }
    if (path === 'data') {
      const feeds = document.querySelector('.feeds');
      const posts = document.querySelector('.posts');

      feeds.innerHTML = '';
      posts.innerHTML = '';

      const feedsTitle = i18nextInstance.t('feedsTitle');
      const postsTitle = i18nextInstance.t('postsTitle');
      const renderedData = renderData(state.data, [feedsTitle, postsTitle]);
      const [rendredFeed, renderedPosts] = renderedData;

      feeds.append(rendredFeed);
      posts.append(renderedPosts);
    }
  });

  input.addEventListener('change', (e) => {
    state.form.processState = 'filling';
    const { value } = e.target;
    schema(state.feedsLog).validate(value)
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url-input');

    if (!state.form.valid) {
      watchedState.form.processState = 'validationError';
    }

    if (state.form.valid) {
      watchedState.form.processState = 'sending';
      axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`)
        .then((responce) => {
          state.feedsLog.push(url);
          const loadedData = responce.data.contents;
          const parsedData = parseData(loadedData);
          const [extractedFeeds, extractedPosts] = extractData(parsedData);
          watchedState.data = {
            feeds: [...state.data.feeds, extractedFeeds],
            posts: [...state.data.posts, ...extractedPosts],
          };
        })
        .catch((error) => {
          state.form.error = error;
          watchedState.form.processState = 'loadingError';
          throw error;
        })
        .then(() => {
          watchedState.form.processState = 'proceed';
          form.reset();
          form.focus();
        });
    }
  });
};
