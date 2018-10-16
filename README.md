# SST CLI

A set om commands to ease the day-to-day work for me at Sjöfartstidningen

## Commands

### `retriever`

`sst retriever` command will takes a list of files and will upload them to the
root of an ftp-url.

This command is mainly used in our organization to upload a set of pdf-files to
an external service once a month.

On the first run you will be prompted for a username, password and url. These
values will be stored in a global configstore (located at
~/.config/configstore/sst-cli.json).

To skip being prompted use the, -u, -p and --url flags to provide the variables.

#### Example

```sh
# Upload every file in current dir ending with _retriever.pdf
sst retriever *_retreiver.pdf

# Specify username, password and url with flags
sst retriever *.pdf -u username -p password --url ftp://ftp.url.com
```
