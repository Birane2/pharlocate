from math import ceil

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request) or self.page_size
        count = self.page.paginator.count
        total_pages = max(1, ceil(count / page_size))

        return Response({
            'count': count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page': self.page.number,
            'page_size': page_size,
            'total_pages': total_pages,
            'results': data,
        })


def paginate_queryset_response(queryset, request, serializer_class, context=None, default_page_size=10):
    paginator = StandardResultsSetPagination()
    paginator.page_size = default_page_size
    page = paginator.paginate_queryset(queryset, request)

    if page is not None:
        serializer = serializer_class(page, many=True, context=context or {})
        return paginator.get_paginated_response(serializer.data)

    serializer = serializer_class(queryset, many=True, context=context or {})
    return Response({
        'count': len(serializer.data),
        'next': None,
        'previous': None,
        'page': 1,
        'page_size': len(serializer.data),
        'total_pages': 1,
        'results': serializer.data,
    })
