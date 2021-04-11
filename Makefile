.PHONY: push

push:
	yarn build; \
  git add .; \
  git commit -m "$(COMMIT_MSG)";\
  git push;
