<template>
  <!-- Load-bearing: Maizzle's inlineLink transformer resolves this href to run the Tailwind pipeline; removing it silently skips CSS compilation. -->
  <link rel="stylesheet" href="../tailwind.css">
  <div>
    <p>Plain template</p>
    <a href="https://example.com">Link</a>
  </div>
</template>
