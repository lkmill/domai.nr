# domai.nr

CLI for the domai.nr API (through RapidAPI.com)

## Usage

First install it globally

```sh
npm i -g domai.nr
```

Create `~/.domainrrc` and set at least your RapidAPI key. You can also create custom tld lists.

```json
{
  "key": "[AKEY]",
  "tlds": {
    "favourite": [
      "adult",
      "porn",
      "sex",
      "xxx"
    ]
  }
}
```

```sh
$ domai.nr mynewdomain.com somethingelse.net idontneedmoredomains.com
$ domai.nr -t com mynewdomain
$ domai.nr -t com,net,io mynewdomain
$ domai.nr -t com,net,io mynewdomain anotherdomain yetanotherone
$ domai.nr -T favourite mynewdomain
$ domai.nr -T favourite,cc mynewdomain
```

## Default TLD lists

Note that since you can only query 10 domains in a single request, querying
large lists gets split up into many smaller requests. 

`cc` lists all ccTLD's.

```sh
$ domai.nr -T cc givemeadomain
```

`generic` lists all generic domains.

```sh
$ domai.nr -T generic givememanydomains
```

Note that these have not been updated for a while. If you find one that is
missing, please open an issue or pull request.
