import onChange from 'on-change';

const elements = {
  input: document.querySelector('#url-input'),
  submitButton: document.querySelector('[type="submit"]'),
  feedback: document.querySelector('.feedback'),
  feeds: document.querySelector('.feeds'),
  posts: document.querySelector('.posts'),
  modalTitle: document.querySelector('.modal-title'),
  modalDescription: document.querySelector('.modal-body'),
  modalFooter: document.querySelector('.modal-footer'),
};

export default (state, i18nextInstance) => onChange(state, (path, value) => {
  const buildData = (data, [dataName1, dataName2]) => {
    const { feeds, posts } = data;
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

    const feedsCardEl = buildCardEl(dataName1);
    const postsCardEl = buildCardEl(dataName2);

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
          postAEl.setAttribute('target', '_blank');
          postAEl.textContent = post.title;

          if (post.clicked) {
            postAEl.classList.remove('fw-bold');
            postAEl.classList.add('fw-normal');
            postAEl.classList.add('link-secondary');
          }

          if (!post.clicked) {
            postAEl.classList.add('fw-bold');
          }

          const modalButton = document.createElement('button');
          modalButton.setAttribute('type', 'button');
          modalButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
          modalButton.dataset.bsTarget = '#modal';
          modalButton.dataset.bsToggle = 'modal';
          modalButton.setAttribute('data-id', post.id);
          modalButton.textContent = i18nextInstance.t('buttonText');

          modalButton.addEventListener('click', () => {
            elements.modalTitle.textContent = post.title;
            elements.modalDescription.textContent = post.description;
            const link = elements.modalFooter.querySelector('.full-article');
            link.setAttribute('href', post.link);
          });

          postLiEl.append(postAEl, modalButton);
          postsList.append(postLiEl);
        }
      });
    });

    feedsCardEl.append(feedsList);
    postsCardEl.append(postsList);

    return [feedsCardEl, postsCardEl];
  };

  if (path === 'form.processState') {
    if (value === 'proceed') {
      elements.input.classList.remove('is-invalid');
      elements.feedback.textContent = i18nextInstance.t('proceed');
      elements.feedback.classList.add('text-success');
      elements.feedback.classList.remove('text-danger');
      elements.submitButton.disabled = false;
    }
    if (value === 'sending') {
      elements.submitButton.disabled = true;
      elements.feedback.textContent = '';
    }
    if (value === 'validationError') {
      elements.submitButton.disabled = false;
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = state.form.error;
    }
    if (value === 'loadingError') {
      elements.submitButton.disabled = false;
      elements.feedback.classList.add('text-danger');
      if (state.form.error.message === 'Invalid RSS') {
        elements.feedback.textContent = i18nextInstance.t('invalidRssError');
      }
      if (state.form.error.message === 'Network Error') {
        elements.feedback.textContent = i18nextInstance.t('networkError');
      }
    }
  }
  if (path === 'data') {
    elements.feeds.innerHTML = '';
    elements.posts.innerHTML = '';

    const feedsTitle = i18nextInstance.t('feedsTitle');
    const postsTitle = i18nextInstance.t('postsTitle');
    const builtData = buildData(state.data, [feedsTitle, postsTitle]);
    const [builtFeed, builtPosts] = builtData;

    elements.feeds.append(builtFeed);
    elements.posts.prepend(builtPosts);
  }
});
