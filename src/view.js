import onChange from 'on-change';

const buildCardEl = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const feedsTitle = document.createElement('h2');
  feedsTitle.classList.add('card-title', 'h4');
  feedsTitle.textContent = title;
  cardBody.append(feedsTitle);
  card.append(cardBody);

  return card;
};

export default (state, i18nextInstance, container) => onChange(state, (path, value) => {
  const elements = {
    input: container.querySelector('#url-input'),
    submitButton: container.querySelector('[type="submit"]'),
    feedback: container.querySelector('.feedback'),
    feeds: container.querySelector('.feeds'),
    posts: container.querySelector('.posts'),
    modalTitle: container.querySelector('.modal-title'),
    modalDescription: container.querySelector('.modal-body'),
    modalFooter: container.querySelector('.modal-footer'),
  };

  const render = (data) => {
    const { feeds, posts } = data;
    const feedsElementTitle = i18nextInstance.t('feedsElementTitle');
    const postsElementTitle = i18nextInstance.t('postsElementTitle');
    const feedsCardEl = buildCardEl(feedsElementTitle);
    const postsCardEl = buildCardEl(postsElementTitle);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'rounded-0');
    const postsList = document.createElement('ul');
    postsList.classList.add('list-group', 'border-0', 'rounded-0');

    feeds.forEach((feed) => {
      const feedLiEl = document.createElement('li');
      feedLiEl.classList.add('list-group-item', 'border-0', 'border-end-0');

      const feedTitle = document.createElement('h3');
      feedTitle.classList.add('h6', 'm-0');
      const feedDescription = document.createElement('p');
      feedDescription.classList.add('m-0', 'small', 'text-black-50');
      feedTitle.textContent = feed.title;
      feedDescription.textContent = feed.description;

      feedLiEl.append(feedTitle, feedDescription);
      feedsList.append(feedLiEl);

      posts.forEach((post) => {
        if (post.feedId === feed.id) {
          const postLiEl = document.createElement('li');
          postLiEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

          const postAEl = document.createElement('a');
          postAEl.setAttribute('href', post.link);
          postAEl.setAttribute('data-id', post.id);
          postAEl.setAttribute('target', '_blank');
          postAEl.setAttribute('rel', 'noopener');
          postAEl.setAttribute('rel', 'norefferer');
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

    const renderedData = render(state.data);
    const [renderedFeed, renderedPosts] = renderedData;

    elements.feeds.append(renderedFeed);
    elements.posts.prepend(renderedPosts);
  }
});
