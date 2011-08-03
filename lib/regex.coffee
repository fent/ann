# validating regexps
regex =
  NICK: /^[A-Z_\-\[\]\\^{}|`][A-Z0-9_\-\[\]\\^{}|`]*$/i # rfc2812
  PASSWORD: /^[^\s]{5,}$/ # checks for white space
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
  KEY: /^[A-Z0-9]+$/i
  CHANNEL: /^[#&][^\x07\x2C\s]{0,200}$/ # rfc1459
  CHANNELPASSWORD: /^[^\s]{1,}$/

makeFun = (name) ->
  r = regex[name.toUpperCase()]
  module.exports[name] = (s) ->
    not r.test s

for i of regex
  makeFun i.toLowerCase()
