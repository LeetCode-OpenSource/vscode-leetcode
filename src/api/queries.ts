// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

export const PROBLEM_LIST_QUERY: string = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
    total
    questions {
      frontendQuestionId
      title
      titleCn
      titleSlug
      difficulty
      paidOnly
      acRate
      status
      isFavor
      topicTags { name nameTranslated slug }
      extra { topCompanyTags { slug name } }
    }
  }
}`;

export const QUESTION_DETAIL_QUERY: string = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    translatedTitle
    titleSlug
    difficulty
    isPaidOnly
    content
    translatedContent
    sampleTestCase
    metaData
    codeSnippets { lang langSlug code }
    topicTags { name translatedName slug }
  }
}`;

export const QUESTION_SOLUTION_QUERY: string = `
query questionSolutionArticles($questionSlug: String!, $first: Int) {
  questionSolutionArticles(questionSlug: $questionSlug, first: $first) {
    edges {
      node {
        title
        slug
        content
      }
    }
  }
}`;

export const QUESTION_OFFICIAL_SOLUTION_QUERY: string = `
query questionSolution($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    solution {
      content
    }
  }
}`;
