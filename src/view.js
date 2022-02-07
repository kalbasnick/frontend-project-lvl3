import onChange from 'on-change';

const buildComponentEl = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const feedsTitle = document.createElement('h2');
  feedsTitle.classList.add('card-title', 'h4');
  feedsTitle.textContent = title;

  cardBody.append(feedsTitle);
  card.append(cardBody);

  const cardList = document.createElement('ul');
  cardList.classList.add('list-group', 'border-0', 'rounded-0');
  card.append(cardList);

  return [card, cardList];
};

export default (container, state, i18nextInstance) => onChange(state, (path, value) => {
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
    const [feedsCard, feedsList] = buildComponentEl(feedsElementTitle);
    const [postsCard, postsList] = buildComponentEl(postsElementTitle);

    feeds.forEach((feed) => {
      const feedLiEl = document.createElement('li');
      feedLiEl.classList.add('list-group-item', 'border-0', 'border-end-0');

      const feedTitle = document.createElement('h3');
      feedTitle.classList.add('h6', 'm-0');
      feedTitle.textContent = feed.title;

      const feedDescription = document.createElement('p');
      feedDescription.classList.add('m-0', 'small', 'text-black-50');
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
          postAEl.classList.add('fw-bold');

          state.uiState.posts.forEach((el) => {
            if (el.clicked && el.postId === post.id) {
              postAEl.classList.remove('fw-bold');
              postAEl.classList.add('fw-normal');
              postAEl.classList.add('link-secondary');
            }
          });

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

    return [feedsCard, postsCard];
  };

  const switchFormToMode = (mode) => {
    switch (mode) {
      case 'lock':
        elements.submitButton.disabled = true;
        elements.input.setAttribute('readonly', 'true');
        break;
      case 'unlock':
        elements.submitButton.disabled = false;
        elements.input.removeAttribute('readonly');
        elements.input.classList.remove('is-invalid');
        break;
      default:
        throw new Error(`Unknown mode: ${mode}! Mode should be 'lock' or 'unlock'.`);
    }
  };

  const switchFeedbackToMode = (mode) => {
    switch (mode) {
      case 'succeed':
        elements.feedback.classList.add('text-success');
        elements.feedback.classList.remove('text-danger');
        break;
      case 'failed':
        elements.feedback.classList.add('text-danger');
        break;
      default:
        throw new Error(`Unknown mode: ${mode}! Mode should be 'succeed' or 'failed'.`);
    }
  };

  if (path === 'form.processState') {
    switch (value) {
      case 'proceed':
        switchFormToMode('unlock');
        switchFeedbackToMode('succeed');
        elements.feedback.textContent = i18nextInstance.t('proceed');
        break;
      case 'sending':
        switchFormToMode('lock');
        elements.feedback.textContent = '';
        break;
      case 'validationError':
        switchFormToMode('unlock');
        switchFeedbackToMode('failed');
        elements.feedback.textContent = state.form.error;
        break;
      case 'loadingError':
        switchFormToMode('unlock');
        switchFeedbackToMode('failed');
        if (state.form.error.message === 'Invalid RSS') {
          elements.feedback.textContent = i18nextInstance.t('invalidRssError');
        }
        if (state.form.error.message === 'Network Error') {
          elements.feedback.textContent = i18nextInstance.t('networkError');
        }
        break;
      default:
        break;
    }
  }
  if (path === 'data' || path === 'uiState.posts') {
    elements.feeds.innerHTML = '';
    elements.posts.innerHTML = '';

    const [feed, posts] = render(state.data);

    elements.feeds.append(feed);
    elements.posts.prepend(posts);
  }
});
