import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index';

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
      required: i18nextInstance.t('validationError.shouldBeUrl'),
      notOneOf: i18nextInstance.t('validationError.alreadyExists'),
    },
    string: {
      url: i18nextInstance.t('validationError.shouldBeUrl'),
    },
  });

  const schema = (data) => yup.string().url().required().notOneOf(data);

  const form = document.querySelector('form');
  const input = document.querySelector('input');
  const feedbackMessage = document.querySelector('.feedback');

  const state = {
    urlInput: {
      value: '',
      state: '',
    },
    feed: [],
    error: '',
  };

  const watchedState = onChange(state, (path, value) => {
    schema(state.feed).validate(value)
      .then(() => {
        state.urlInput.state = 'valid';
      })
      .catch((e) => {
        state.urlInput.state = 'invalid';
        state.error = e.errors;
      })
      .then(() => {
        if (state.urlInput.state === 'invalid') {
          input.classList.add('is-invalid');
          feedbackMessage.textContent = state.error;
          feedbackMessage.classList.add('text-danger');
        }
        if (state.urlInput.state === 'valid') {
          input.classList.remove('is-invalid');
        }
      });
  });

  input.addEventListener('change', (e) => {
    watchedState.urlInput.value = e.target.value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url-input');

    if (state.urlInput.state === 'valid') {
      state.feed.push(url);
      feedbackMessage.textContent = i18nextInstance.t('successLoad');
      feedbackMessage.classList.add('text-success');
      feedbackMessage.classList.remove('text-danger');
      state.urlInput.value = '';
      form.reset();
      form.focus();
    }
  });
};
