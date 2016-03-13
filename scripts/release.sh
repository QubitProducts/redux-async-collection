if [[ -n $(git status --porcelain) ]];
then
   echo "Repo is dirty. please commit before releasing";
   exit 1;
fi

if [[ $(git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3) != "master" ]]
then
  echo "Can only release from master";
  exit 1;
fi

echo "Building"
make build

echo "Commit artifacts"
git add -A
git commit -m 'Release'

npm version $inc

echo "Pushing changes"
git push origin master
git push origin --tags
